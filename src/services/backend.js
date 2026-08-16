import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";

// Appwrite Client Initialization
const client = new Client()
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT)
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Collection & Bucket Constants
const DB_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const IMAGES_COLLECTION = process.env.REACT_APP_APPWRITE_IMAGES_COLLECTION_ID;
const FAVORITES_COLLECTION = process.env.REACT_APP_APPWRITE_FAVORITES_COLLECTION_ID;
const PROFILES_COLLECTION = "profiles";
const IMAGES_BUCKET = process.env.REACT_APP_APPWRITE_IMAGES_BUCKET_ID;
const AVATARS_BUCKET = process.env.REACT_APP_APPWRITE_AVATARS_BUCKET_ID;

// Permission Generator Helper
const userDocPermissions = (userId, isPublic = true) => [
    Permission.read(isPublic ? Role.any() : Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
];

// Admin Validator
export const isPermittedAdmin = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.includes("admin1") || lower.includes("admin2");
};

// Profile Lookup / Sync Helper
const getProfileByUserId = async (userId) => {
    try {
        const res = await databases.listDocuments(DB_ID, PROFILES_COLLECTION, [
            Query.equal("userId", userId),
            Query.limit(1),
        ]);
        return res.documents[0] || null;
    } catch {
        return null;
    }
};

const syncProfileDoc = async ({ userId, name, email, avatarUrl = "" }) => {
    const existing = await getProfileByUserId(userId);
    const data = {
        userId,
        name: name || "User",
        email: email || "",
        avatarUrl,
        isAdmin: isPermittedAdmin(email),
        isBlocked: false,
    };

    if (existing) {
        return await databases.updateDocument(DB_ID, PROFILES_COLLECTION, existing.$id, data);
    }
    return await databases.createDocument(
        DB_ID,
        PROFILES_COLLECTION,
        ID.unique(),
        data,
        userDocPermissions(userId, true)
    );
};

export const authService = {
    // 1. Password Signup
    async register({ email, password, name, avatarFile }) {
        const user = await account.create(ID.unique(), email, password, name);
        await account.createEmailPasswordSession(email, password);

        let avatarUrl = "";
        if (avatarFile) {
            const file = await storage.createFile(AVATARS_BUCKET, ID.unique(), avatarFile);
            avatarUrl = storage.getFileView(AVATARS_BUCKET, file.$id);
            await account.updatePrefs({ avatarUrl, avatarFileId: file.$id });
        }

        await syncProfileDoc({ userId: user.$id, name, email, avatarUrl }).catch(() => { });
        return user;
    },

    // 2. Password Login
    async login(email, password) {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        const profile = await getProfileByUserId(user.$id);

        if (profile?.isBlocked) {
            await account.deleteSession("current");
            throw new Error("Your account has been suspended by the administrator.");
        }
        return session;
    },

    // 3. OAuth & Anonymous
    loginWithGoogle() {
        return account.createOAuth2Session(
            "google",
            `${window.location.origin}/`,
            `${window.location.origin}/login`
        );
    },

    loginAnonymously() {
        return account.createAnonymousSession();
    },

    // 4. OTP & Magic URL
    sendEmailOTP(email) {
        return account.createEmailToken(ID.unique(), email);
    },

    verifyEmailOTP(userId, secret) {
        return account.createSession(userId, secret);
    },

    sendMagicURL(email) {
        return account.createMagicURLToken(
            ID.unique(),
            email,
            `${window.location.origin}/verify-magic-url`
        );
    },

    verifyMagicURL(userId, secret) {
        return account.createSession(userId, secret);
    },

    // 5. Email Verification
    sendEmailVerification() {
        return account.createVerification(`${window.location.origin}/verify-email`);
    },

    confirmEmailVerification(userId, secret) {
        return account.updateVerification(userId, secret);
    },

    // 6. Profile Management
    async updateProfileName(name) {
        const updated = await account.updateName(name);
        const profile = await getProfileByUserId(updated.$id);
        if (profile) {
            await databases.updateDocument(DB_ID, PROFILES_COLLECTION, profile.$id, { name }).catch(() => { });
        }
        return updated;
    },

    setOrUpdatePassword(newPassword, oldPassword = "") {
        return oldPassword
            ? account.updatePassword(newPassword, oldPassword)
            : account.updatePassword(newPassword);
    },

    async linkAnonymousAccount(email, password, name) {
        await account.updateEmail(email, password);
        await account.updateName(name);
        const user = await account.get();
        await syncProfileDoc({ userId: user.$id, name, email });
        return user;
    },

    async updateAvatar(avatarFile) {
        const user = await account.get();
        const prefs = await account.getPrefs();

        if (prefs.avatarFileId) {
            await storage.deleteFile(AVATARS_BUCKET, prefs.avatarFileId).catch(() => { });
        }

        const file = await storage.createFile(AVATARS_BUCKET, ID.unique(), avatarFile);
        const avatarUrl = storage.getFileView(AVATARS_BUCKET, file.$id);
        await account.updatePrefs({ ...prefs, avatarUrl, avatarFileId: file.$id });

        const profile = await getProfileByUserId(user.$id);
        if (profile) {
            await databases.updateDocument(DB_ID, PROFILES_COLLECTION, profile.$id, { avatarUrl }).catch(() => { });
        }
        return avatarUrl;
    },

    async getCurrentUser() {
        try {
            const user = await account.get();
            const prefs = await account.getPrefs();
            const isAnonymous = !user.email;
            const isAdmin = isPermittedAdmin(user.email);

            if (isAnonymous) {
                return { ...user, ...prefs, isAdmin: false, isBlocked: false, isAnonymous: true };
            }

            let profile = await getProfileByUserId(user.$id);
            if (profile?.isBlocked) {
                await account.deleteSession("current");
                return null;
            }

            if (!profile) {
                profile = await syncProfileDoc({
                    userId: user.$id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: prefs.avatarUrl || "",
                }).catch(() => null);
            }

            return {
                ...user,
                ...prefs,
                isAdmin,
                isBlocked: Boolean(profile?.isBlocked),
                isAnonymous: false,
            };
        } catch {
            return null;
        }
    },

    logout() {
        return account.deleteSession("current").catch(() => { });
    },
};

export const mediaService = {
    async uploadMedia({ file, description, isPublic, user }) {
        const mediaType = file.type.startsWith("video") ? "video" : "image";
        const uploadedFile = await storage.createFile(
            IMAGES_BUCKET,
            ID.unique(),
            file,
            userDocPermissions(user.$id, true)
        );

        return databases.createDocument(
            DB_ID,
            IMAGES_COLLECTION,
            ID.unique(),
            {
                fileId: uploadedFile.$id,
                description: description || "",
                isPublic: Boolean(isPublic),
                mediaType,
                favoritesCount: 0,
                userId: user.$id,
                userName: user.name || "Anonymous",
                createdAt: new Date().toISOString(),
            },
            userDocPermissions(user.$id, isPublic)
        );
    },

    getMediaUrl(fileId) {
        return storage.getFileView(IMAGES_BUCKET, fileId);
    },

    getMediaDownloadUrl(fileId) {
        return storage.getFileDownload(IMAGES_BUCKET, fileId);
    },

    async getFeedMedia(currentUserId) {
        try {
            const queries = [Query.equal("isPublic", true), Query.orderDesc("createdAt")];
            const publicDocs = await databases.listDocuments(DB_ID, IMAGES_COLLECTION, queries);

            let privateDocs = [];
            if (currentUserId) {
                const privRes = await databases.listDocuments(DB_ID, IMAGES_COLLECTION, [
                    Query.equal("userId", currentUserId),
                    Query.equal("isPublic", false),
                    Query.orderDesc("createdAt"),
                ]).catch(() => ({ documents: [] }));
                privateDocs = privRes.documents;
            }

            const map = new Map();
            [...publicDocs.documents, ...privateDocs].forEach((doc) => map.set(doc.$id, doc));
            return Array.from(map.values());
        } catch {
            return [];
        }
    },

    getMediaById(id) {
        return databases.getDocument(DB_ID, IMAGES_COLLECTION, id);
    },

    updateMedia(id, { description, isPublic }) {
        return databases.updateDocument(DB_ID, IMAGES_COLLECTION, id, {
            description,
            isPublic,
        });
    },

    async deleteMedia(id, fileId) {
        await storage.deleteFile(IMAGES_BUCKET, fileId).catch(() => { });
        return databases.deleteDocument(DB_ID, IMAGES_COLLECTION, id);
    },

    async toggleFavorite(userId, imageId) {
        const existing = await databases.listDocuments(DB_ID, FAVORITES_COLLECTION, [
            Query.equal("userId", userId),
            Query.equal("imageId", imageId),
            Query.limit(1),
        ]);

        const mediaDoc = await databases.getDocument(DB_ID, IMAGES_COLLECTION, imageId);
        const currentCount = mediaDoc.favoritesCount || 0;
        const isFavorited = existing.total > 0;

        if (isFavorited) {
            await databases.deleteDocument(DB_ID, FAVORITES_COLLECTION, existing.documents[0].$id);
        } else {
            await databases.createDocument(
                DB_ID,
                FAVORITES_COLLECTION,
                ID.unique(),
                { userId, imageId },
                userDocPermissions(userId, true)
            );
        }

        const updatedCount = Math.max(0, isFavorited ? currentCount - 1 : currentCount + 1);
        await databases.updateDocument(DB_ID, IMAGES_COLLECTION, imageId, {
            favoritesCount: updatedCount,
        });

        return { isFavorited: !isFavorited, newCount: updatedCount };
    },

    async getUserFavorites(userId) {
        if (!userId) return { documents: [] };
        try {
            const favs = await databases.listDocuments(DB_ID, FAVORITES_COLLECTION, [
                Query.equal("userId", userId),
            ]);
            const imageIds = favs.documents.map((d) => d.imageId);
            if (!imageIds.length) return { documents: [] };

            return await databases.listDocuments(DB_ID, IMAGES_COLLECTION, [
                Query.equal("$id", imageIds),
            ]);
        } catch {
            return { documents: [] };
        }
    },

    async checkIsFavorite(userId, imageId) {
        if (!userId) return false;
        try {
            const existing = await databases.listDocuments(DB_ID, FAVORITES_COLLECTION, [
                Query.equal("userId", userId),
                Query.equal("imageId", imageId),
                Query.limit(1),
            ]);
            return existing.total > 0;
        } catch {
            return false;
        }
    },
};

export const adminService = {
    async getAllUsers() {
        const res = await databases.listDocuments(DB_ID, PROFILES_COLLECTION, [
            Query.orderDesc("$createdAt"),
        ]);
        return res.documents;
    },

    toggleBlockUser(documentId, isBlocked) {
        return databases.updateDocument(DB_ID, PROFILES_COLLECTION, documentId, {
            isBlocked,
        });
    },
};