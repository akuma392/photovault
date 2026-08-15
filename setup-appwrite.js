// setup-appwrite.js
const { Client, Databases, Storage, Permission, Role } = require('node-appwrite');

const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = 'akuma392';
const API_KEY = 'standard_3ec4aa258390fe2b8e435736124343380034abe6e475edc720d4b1cfbd2aad39a17ad42bf4dff4c60dbede2cc71b4529094526bb6060f1e1c75600625446184c94c54489dea4101e635b28464ec9d8a413385f296a16ed2d20b3c42d10d4853dba48b8af05615d2dd6ef48fb4b87ef4b6bcf3593001fd3f0479a57bea8d463fe';
const DB_ID = '6a7f435500287dd1f5c1';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function init() {
    console.log(`🚀 Updating Appwrite schema in database: ${DB_ID}...\n`);

    // 1. Add mediaType attribute to "images" collection if missing
    try {
        await databases.createStringAttribute(DB_ID, 'images', 'mediaType', 20, false, 'image');
        console.log('  ➕ Added attribute: images.mediaType');
    } catch (e) {
        console.log('  ℹ️ images.mediaType already exists.');
    }

    await sleep(1000);

    // 2. Create "profiles" Collection for Users & Admin Management
    try {
        await databases.createCollection(DB_ID, 'profiles', 'Profiles', [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ]);
        console.log('✅ Collection "profiles" created.');
    } catch (e) {
        if (e.code === 409) console.log('ℹ️ Collection "profiles" already exists.');
    }

    await sleep(1000);

    const profileAttrs = [
        { name: 'userId', fn: () => databases.createStringAttribute(DB_ID, 'profiles', 'userId', 255, true) },
        { name: 'name', fn: () => databases.createStringAttribute(DB_ID, 'profiles', 'name', 255, true) },
        { name: 'email', fn: () => databases.createStringAttribute(DB_ID, 'profiles', 'email', 255, true) },
        { name: 'avatarUrl', fn: () => databases.createStringAttribute(DB_ID, 'profiles', 'avatarUrl', 1000, false) },
        { name: 'isAdmin', fn: () => databases.createBooleanAttribute(DB_ID, 'profiles', 'isAdmin', false, true) },
        { name: 'isBlocked', fn: () => databases.createBooleanAttribute(DB_ID, 'profiles', 'isBlocked', false, true) },
    ];

    for (const attr of profileAttrs) {
        try {
            await attr.fn();
            console.log(`  ➕ Attribute created: profiles.${attr.name}`);
            await sleep(600);
        } catch (e) {
            if (e.code === 409) console.log(`  ℹ️ Attribute already exists: profiles.${attr.name}`);
        }
    }

    console.log('\n🎉 Schema update complete!');
}

init();