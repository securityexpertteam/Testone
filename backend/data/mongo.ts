import { Db, MongoClient } from 'mongodb';

let client: MongoClient | undefined;
let database: Db | undefined;
let backupClient: MongoClient | undefined;
let backupDatabase: Db | undefined;
let backupRetryTimer: NodeJS.Timeout | undefined;
const BACKUP_EXCLUDED_COLLECTIONS = new Set(['catalog_backup_queue']);

const backupIdKey = (id: unknown): string => {
  if (id && typeof id === 'object' && 'toHexString' in id && typeof (id as { toHexString?: unknown }).toHexString === 'function') {
    return `objectId:${(id as { toHexString: () => string }).toHexString()}`;
  }
  return `${typeof id}:${JSON.stringify(id)}`;
};

const mirrorPrimaryDatabaseSnapshot = async () => {
  if (!database || !backupDatabase) return;
  const primaryCollections = (await database.listCollections({}, { nameOnly: true }).toArray())
    .map(({ name }) => name)
    .filter(name => !name.startsWith('system.') && !BACKUP_EXCLUDED_COLLECTIONS.has(name));
  const backupCollections = new Set((await backupDatabase.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));

  for (const name of primaryCollections) {
    if (!backupCollections.has(name)) {
      await backupDatabase.createCollection(name);
      backupCollections.add(name);
    }

    const source = database.collection(name);
    const target = backupDatabase.collection(name);
    const sourceIds = new Set<string>();
    let operations: any[] = [];
    for await (const document of source.find({})) {
      sourceIds.add(backupIdKey(document._id));
      operations.push({ replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true } });
      if (operations.length >= 250) {
        await target.bulkWrite(operations, { ordered: false });
        operations = [];
      }
    }
    if (operations.length) await target.bulkWrite(operations, { ordered: false });

    let staleOperations: any[] = [];
    for await (const { _id } of target.find({}, { projection: { _id: 1 } })) {
      if (!sourceIds.has(backupIdKey(_id))) {
        staleOperations.push({ deleteOne: { filter: { _id } } });
        if (staleOperations.length >= 250) {
          await target.bulkWrite(staleOperations, { ordered: false });
          staleOperations = [];
        }
      }
    }
    if (staleOperations.length) await target.bulkWrite(staleOperations, { ordered: false });
  }

  for (const name of backupCollections) {
    if (name !== 'seller_catalog_backup' && !BACKUP_EXCLUDED_COLLECTIONS.has(name) && !primaryCollections.includes(name)) {
      await backupDatabase.collection(name).drop();
    }
  }
};

const applyDatabaseBackupChange = async (change: any) => {
  if (!database || !backupDatabase) return;
  const collectionName = change.ns?.coll as string | undefined;
  if (!collectionName || collectionName.startsWith('system.') || BACKUP_EXCLUDED_COLLECTIONS.has(collectionName)) return;
  if (change.operationType === 'drop') {
    await backupDatabase.collection(collectionName).drop().catch(() => undefined);
    return;
  }
  const id = change.documentKey?._id;
  if (id === undefined) return;
  const currentDocument = await database.collection(collectionName).findOne({ _id: id });
  const backupCollection = backupDatabase.collection(collectionName);
  if (currentDocument) {
    await backupCollection.replaceOne({ _id: id }, currentDocument, { upsert: true });
  } else {
    await backupCollection.deleteOne({ _id: id });
  }
};

const applyDatabaseBackupChangeWithRetry = async (change: any) => {
  while (database && backupDatabase) {
    try {
      await applyDatabaseBackupChange(change);
      return;
    } catch (error) {
      console.error('Database backup change failed; retrying', change.ns?.coll, error);
      await new Promise(resolve => setTimeout(resolve, 5_000));
    }
  }
};

const runDatabaseBackupChangeStream = async () => {
  while (database && backupDatabase) {
    let stream: ReturnType<Db['watch']> | undefined;
    try {
      stream = database.watch([
        { $match: { operationType: { $in: ['insert', 'update', 'replace', 'delete', 'drop'] }, 'ns.coll': { $nin: [...BACKUP_EXCLUDED_COLLECTIONS] } } }
      ], { fullDocument: 'updateLookup' });
      let snapshotInProgress = true;
      const pendingChanges: any[] = [];
      let streamError: unknown;
      const consumeChanges = (async () => {
        try {
          for await (const change of stream!) {
            if (snapshotInProgress) pendingChanges.push(change);
            else await applyDatabaseBackupChangeWithRetry(change);
          }
        } catch (error) {
          streamError = error;
        }
      })();

      await mirrorPrimaryDatabaseSnapshot();
      while (pendingChanges.length) await applyDatabaseBackupChangeWithRetry(pendingChanges.shift());
      snapshotInProgress = false;
      console.info('[Mongo Backup] All database collections are synchronized; change stream is active.');
      await consumeChanges;
      throw streamError || new Error('MongoDB change stream ended unexpectedly');
    } catch (error) {
      console.error('[Mongo Backup] Change stream stopped; reconciling and retrying.', error);
      await stream?.close().catch(() => undefined);
      await new Promise(resolve => setTimeout(resolve, 15_000));
    }
  }
};

type CatalogBackupOperation = 'UPSERT' | 'DELETE';
const writeCatalogBackupSnapshot = async (snapshot: Record<string, any>) => {
  if (!backupDatabase) throw new Error('MONGODB_BACKUP_URI is not configured');
  await backupDatabase.collection('seller_catalog_backup').updateOne(
    { productId: snapshot.productId },
    { $set: { ...snapshot, backupUpdatedAt: new Date() } },
    { upsert: true }
  );
};

const retryCatalogBackupQueue = async () => {
  if (!database || !backupDatabase) return;
  const queue = database.collection('catalog_backup_queue');
  const pending = await queue.find({}).limit(100).toArray();
  for (const item of pending) {
    try {
      await writeCatalogBackupSnapshot(item.snapshot);
      await queue.deleteOne({ productId: item.productId });
    } catch (error) {
      console.error('Catalog backup retry failed', item.productId, error);
    }
  }
};

export const syncCatalogProductBackup = async (
  productId: string,
  sellerId: string,
  operation: CatalogBackupOperation = 'UPSERT'
): Promise<{ configured: boolean; synced: boolean }> => {
  if (!backupDatabase || !database) return { configured: false, synced: false };
  const product = operation === 'DELETE' ? null : await database.collection('products').findOne({ id: productId, sellerId });
  const snapshot = {
    productId,
    sellerId,
    operation,
    deleted: operation === 'DELETE' || !product,
    product: product || null,
    sourceUpdatedAt: product?.updatedAt || new Date()
  };
  try {
    await writeCatalogBackupSnapshot(snapshot);
    await database.collection('catalog_backup_queue').deleteOne({ productId });
    return { configured: true, synced: true };
  } catch (error) {
    console.error('Catalog backup write failed; queued for retry', productId, error);
    try {
      await database.collection('catalog_backup_queue').updateOne(
        { productId },
        { $set: { productId, snapshot, queuedAt: new Date() } },
        { upsert: true }
      );
    } catch (queueError) {
      console.error('Unable to queue catalog backup write', productId, queueError);
    }
    return { configured: true, synced: false };
  }
};

const initializeCatalogBackup = async (primaryUri: string) => {
  const backupUri = process.env.MONGODB_BACKUP_URI;
  if (!backupUri) return;
  const deploymentAddress = (uri: string) => uri.split('@').pop()?.split('/')[0]?.toLowerCase() || '';
  if (backupUri === primaryUri || deploymentAddress(backupUri) === deploymentAddress(primaryUri)) {
    console.warn('Catalog backup is disabled: MONGODB_BACKUP_URI points to the primary MongoDB deployment. Configure a separate deployment to enable mirroring.');
    return;
  }
  backupClient = new MongoClient(backupUri);
  await backupClient.connect();
  backupDatabase = backupClient.db(process.env.MONGODB_BACKUP_DB || `${process.env.MONGODB_DB || 'akshaya_patra'}_backup`);
  await backupDatabase.collection('seller_catalog_backup').createIndex({ productId: 1 }, { unique: true });
  const products = await database!.collection('products').find({}).toArray();
  const activeProductIds = products.map(product => product.id);
  for (const product of products) {
    await writeCatalogBackupSnapshot({
      productId: product.id,
      sellerId: product.sellerId,
      operation: 'UPSERT',
      deleted: false,
      product,
      sourceUpdatedAt: product.updatedAt || new Date()
    });
  }
  await backupDatabase.collection('seller_catalog_backup').updateMany(
    { productId: { $nin: activeProductIds }, deleted: { $ne: true } },
    { $set: { operation: 'MISSING_FROM_PRIMARY', deleted: true, product: null, backupUpdatedAt: new Date() } }
  );
  await backupDatabase.collection('seller_catalog_backup').createIndex({ sellerId: 1, deleted: 1 });
  await retryCatalogBackupQueue();
  backupRetryTimer = setInterval(() => { void retryCatalogBackupQueue(); }, 30_000);
  backupRetryTimer.unref();
  void runDatabaseBackupChangeStream();
};

export const connectMongo = async (): Promise<Db> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI must be configured');
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(process.env.MONGODB_DB || 'akshaya_patra');
  // Create the application collections during startup, including ledgers that
  // may be empty on a new installation. createCollection is idempotent here.
  const collectionNames = [
    'users', 'sellers', 'seller_portal', 'products', 'orders', 'payments',
    'donations', 'raffle_campaigns', 'raffle_tickets', 'raffle_draws',
    'raffle_sequences', 'carts', 'catalog_backup_queue'
  ];
  const existingCollections = new Set((await database.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));
  await Promise.all(collectionNames.filter(name => !existingCollections.has(name)).map(name => database!.createCollection(name)));
  // Remove the development-only demo seller account that older versions seeded.
  await database.collection('sellers').deleteOne({ sellerId: 'SLR-HYD-8821', email: 'seller@akshayapatrawelfare.org' });
  const legacySellerPortal = database.collection('seller_portal');
  await legacySellerPortal.updateOne(
    { sellerId: 'SLR-HYD-8821' },
    { $pull: {
      inventoryLogs: { id: { $in: ['ADJ-2026-091', 'ADJ-2026-092'] } },
      payouts: { id: { $in: ['PAY-2026-SEP-01', 'PAY-2026-SEP-02'] } },
      notifications: { id: { $in: ['notif-001', 'notif-002', 'notif-003', 'notif-004'] } },
      tickets: { id: { $in: ['TCK-2026-041', 'TCK-2026-039'] } }
    } } as any
  );
  await legacySellerPortal.updateOne(
    { sellerId: 'SLR-HYD-8821', 'profile.storeDescription': 'Certified rural cooperative of 65 women artisans, organic oil pressers, and traditional potters from Medak and Sangareddy districts. In partnership with Akshaya Patra Welfare Foundation, 100% of profits fund child nutrition and rural livelihood.', 'profile.storeLogo': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80' },
    { $set: { profile: { sellerId: 'SLR-HYD-8821' }, updatedAt: new Date() } }
  );
  await Promise.all([
    database.collection('users').createIndex({ loginId: 1 }, { unique: true }),
    database.collection('sellers').createIndex({ email: 1 }, { unique: true }),
    database.collection('seller_portal').createIndex({ sellerId: 1 }, { unique: true }),
    database.collection('products').createIndex({ id: 1 }, { unique: true }),
    database.collection('products').createIndex({ sellerId: 1, sku: 1 }, { unique: true }),
    database.collection('orders').createIndex({ orderId: 1 }, { unique: true }),
    database.collection('payments').createIndex({ transactionId: 1 }, { unique: true }),
    database.collection('payments').createIndex({ orderId: 1 }, { unique: true }),
    database.collection('donations').createIndex({ donationId: 1 }, { unique: true }),
    database.collection('donations').createIndex({ orderId: 1, donationId: 1 }, { unique: true }),
    database.collection('raffle_campaigns').createIndex({ campaignId: 1 }, { unique: true }),
    database.collection('raffle_tickets').createIndex({ ticketNumber: 1 }, { unique: true }),
    database.collection('raffle_tickets').createIndex({ campaignId: 1, status: 1, ticketNumber: 1 }),
    database.collection('raffle_tickets').createIndex({ orderId: 1, buyerId: 1 }),
    database.collection('raffle_draws').createIndex({ campaignId: 1 }, { unique: true }),
    database.collection('raffle_draws').createIndex({ ticketNumber: 1 }, { unique: true }),
    database.collection('raffle_sequences').createIndex({ campaignId: 1 }, { unique: true }),
    database.collection('carts').createIndex({ cartId: 1 }, { unique: true }),
    database.collection('carts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection('catalog_backup_queue').createIndex({ productId: 1 }, { unique: true })
  ]);
  const legacyProductId = 'prod-diwali-crackers-family-pack';
  const legacyCampaignId = 'diwali-2026-iphone-draw';
  const [legacyOrders, legacyTickets] = await Promise.all([
    database.collection('orders').countDocuments({ 'orderDetails.productId': legacyProductId }),
    database.collection('raffle_tickets').countDocuments({ campaignId: legacyCampaignId })
  ]);
  if (legacyOrders === 0 && legacyTickets === 0) {
    await Promise.all([
      database.collection('products').deleteOne({ id: legacyProductId, sellerId: 'SLR-HYD-8821' }),
      database.collection('raffle_campaigns').deleteOne({ campaignId: legacyCampaignId, sellerId: 'SLR-HYD-8821' }),
      database.collection('raffle_sequences').deleteOne({ campaignId: legacyCampaignId }),
      database.collection('raffle_draws').deleteOne({ campaignId: legacyCampaignId })
    ]);
  }
  await initializeCatalogBackup(uri);
  return database;
};

export const getMongoDb = (): Db => {
  if (!database) {
    throw new Error('MongoDB is not connected');
  }
  return database;
};

export const closeMongo = async (): Promise<void> => {
  if (backupRetryTimer) clearInterval(backupRetryTimer);
  backupRetryTimer = undefined;
  await backupClient?.close();
  backupClient = undefined;
  backupDatabase = undefined;
  await client?.close();
  client = undefined;
  database = undefined;
};

export const getMongoClient = (): MongoClient => {
  if (!client) {
    throw new Error('MongoDB is not connected');
  }
  return client;
};
