import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";

const client = new Client()
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT)
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const IMAGES_COLLECTION = process.env.REACT_APP_APPWRITE_IMAGES_COLLECTION_ID;
const FAVORITES_COLLECTION = process.env.REACT_APP_APPWRITE_FAVORITES_COLLECTION_ID;
const PROFILES_COLLECTION = "profiles";
const IMAGES_BUCKET = process.env.REACT_APP_APPWRITE_IMAGES_BUCKET_ID;
const AVATARS_BUCKET = process.env.REACT_APP_APPWRITE_AVATARS_BUCKET_ID;

// Strict Admin Checker: Only emails containing 'admin1' or 'admin2'
export const isPermittedAdmin = (email) => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return lowerEmail.includes("admin1") || lowerEmail.includes("admin2");
};

export const authService = {
    // 1. Password Registration
    async register({ email, password, name, avatarFile }) {
        const user = await account.create(ID.unique(), email, password, name);
        await account.createEmailPasswordSession(email, password);

        let avatarUrl = "";
        if (avatarFile) {
            const file = await storage.createFile(AVATARS_BUCKET, ID.unique(), avatarFile);
            avatarUrl = storage.getFileView(AVATARS_BUCKET, file.$id);
            await account.updatePrefs({ avatarUrl, avatarFileId: file.$id });
        }

        const isAdmin = isPermittedAdmin(email);
        try {
            await databases.createDocument(
                DB_ID,
                PROFILES_COLLECTION,
                ID.unique(),
                {
                    userId: user.$id,
                    name: name || "User",
                    email,
                    avatarUrl,
                    isAdmin,
                    isBlocked: false,
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ]
            );
        } catch (err) {
            console.warn("Profile document creation note:", err.message);
        }

        return user;
    },

    // 2. Email / Password Login
    async login(email, password) {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();

        try {
            const profileRes = await databases.listDocuments(DB_ID, PROFILES_COLLECTION, [
                Query.equal("userId", user.$id),
            ]);
            if (profileRes.documents.length > 0 && profileRes.documents[0].isBlocked) {
                await account.deleteSession("current");
                throw new Error("Your account has been suspended by the administrator.");
            }
        } catch (err) {
            if (err.message.includes("suspended")) throw err;
        }

        return session;
    },

    // 3. Google OAuth Login
    async loginWithGoogle() {
        return account.createOAuth2Session(
            "google",
            `${window.location.origin}/`,
            `${window.location.origin}/login`
        );
    },

    // 4. Anonymous Guest Session
    async loginAnonymously() {
        return await account.createAnonymousSession();
    },

    // 5. Email OTP Methods
    async sendEmailOTP(email) {
        return await account.createEmailToken(ID.unique(), email);
    },

    async verifyEmailOTP(userId, secret) {
        return await account.createSession(userId, secret);
    },

    // 6. Magic URL Methods
    async sendMagicURL(email) {
        return await account.createMagicURLToken(
            ID.unique(),
            email,
            `${window.location.origin}/verify-magic-url`
        );
    },

    async verifyMagicURL(userId, secret) {
        return await account.createSession(userId, secret);
    },

    // Update Display Name
    async updateProfileName(name) {
        const updatedAccount = await account.updateName(name);
        try {
            const profileRes = await databases.listDocuments(DB_ID, PROFILES_COLLECTION, [
                Query.equal("userId", updatedAccount.$id),
            ]);
            if (profileRes.documents.length > 0) {
                await databases.updateDocument(DB_ID, PROFILES_COLLECTION, profileRes.documents[0].$id, {
                    name,
                });
            }
        } catch (err) {
            console.warn("Name sync skipped:", err.message);
        }
        return updatedAccount;
    },

    // Set or Change Password
    async setOrUpdatePassword(newPassword, oldPassword = "") {
        if (oldPassword) {
            return await account.updatePassword(newPassword, oldPassword);
        } else {
            return await account.updatePassword(newPassword);
        }
    },

    // Convert Anonymous user to permanent account
    async linkAnonymousAccount(email, password, name) {
        await account.updateEmail(email, password);
        await account.updateName(name);

        const user = await account.get();
        const isAdmin = isPermittedAdmin(email);

        await databases.createDocument(
            DB_ID,
            PROFILES_COLLECTION,
            ID.unique(),
            {
                userId: user.$id,
                name,
                email,
                avatarUrl: "",
                isAdmin,
                isBlocked: false,
            },
            [
                Permission.read(Role.any()),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]
        );

        return user;
    },

    // Update Avatar
    async updateAvatar(avatarFile) {
        const user = await account.get();
        const prefs = await account.getPrefs();

        if (prefs.avatarFileId) {
            try {
                await storage.deleteFile(AVATARS_BUCKET, prefs.avatarFileId);
            } catch (err) {
                console.warn("Old avatar cleanup note:", err.message);
            }
        }

        const file = await storage.createFile(AVATARS_BUCKET, ID.unique(), avatarFile);
        const avatarUrl = storage.getFileView(AVATARS_BUCKET, file.$id);
        await account.updatePrefs({ ...prefs, avatarUrl, avatarFileId: file.$id });

        try {
            const profileRes = await databases.listDocuments(DB_ID, PROFILES_COLLECTION, [
                Query.equal("userId", user.$id),
            ]);
            if (profileRes.documents.length > 0) {
                await databases.updateDocument(DB_ID, PROFILES_COLLECTION, profileRes.documents[0].$id, {
                    avatarUrl,
                });
            }
        } catch (err) {
            console.warn("Avatar sync skipped:", err.message);
        }

        return avatarUrl;
    },

    // Current Session & Profile Check
    async getCurrentUser() {
        try {
            const user = await account.get();
            const prefs = await account.getPrefs();

            const isAnonymous = !user.email;
            const isAdmin = isPermittedAdmin(user.email);
            let isBlocked = false;

            if (!isAnonymous) {
                try {
                    const profileRes = await databases.listDocuments(DB_ID, PROFILES_COLLECTION, [
                        Query.equal("userId", user.$id),
                    ]);
                    if (profileRes.documents.length > 0) {
                        isBlocked = profileRes.documents[0].isBlocked;
                        if (isBlocked) {
                            await account.deleteSession("current");
                            return null;
                        }
                    } else {
                        await databases.createDocument(
                            DB_ID,
                            PROFILES_COLLECTION,
                            ID.unique(),
                            {
                                userId: user.$id,
                                name: user.name || "User",
                                email: user.email,
                                avatarUrl: prefs.avatarUrl || "",
                                isAdmin,
                                isBlocked: false,
                            },
                            [
                                Permission.read(Role.any()),
                                Permission.update(Role.user(user.$id)),
                                Permission.delete(Role.user(user.$id)),
                            ]
                        );
                    }
                } catch (e) {
                    // ignore lookup errors
                }
            }

            return { ...user, ...prefs, isAdmin, isBlocked, isAnonymous };
        } catch {
            return null;
        }
    },

    async logout() {
        try {
            return await account.deleteSession("current");
        } catch (err) {
            console.warn("Logout error:", err);
        }
    },
};

export const mediaService = {
    async uploadMedia({ file, description, isPublic, user }) {
        const mediaType = file.type.startsWith("video") ? "video" : "image";
        const uploadedFile = await storage.createFile(
            IMAGES_BUCKET,
            ID.unique(),
            file,
            [
                Permission.read(Role.any()),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]
        );

        return await databases.createDocument(
            DB_ID,
            IMAGES_COLLECTION,
            ID.unique(),
            {
                fileId: uploadedFile.$id,
                description: description || "",
                isPublic: Boolean(isPublic),
                mediaType,
                userId: user.$id,
                userName: user.name || "Anonymous",
                createdAt: new Date().toISOString(),
            },
            [
                Permission.read(isPublic ? Role.any() : Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]
        );
    },

    getMediaUrl(fileId) {
        return storage.getFileView(IMAGES_BUCKET, fileId);
    },

    async getFeedMedia(currentUserId) {
        try {
            const publicDocs = await databases.listDocuments(DB_ID, IMAGES_COLLECTION, [
                Query.equal("isPublic", true),
                Query.orderDesc("createdAt"),
            ]);

            let userDocs = { documents: [] };
            if (currentUserId) {
                try {
                    userDocs = await databases.listDocuments(DB_ID, IMAGES_COLLECTION, [
                        Query.equal("userId", currentUserId),
                        Query.equal("isPublic", false),
                        Query.orderDesc("createdAt"),
                    ]);
                } catch (e) {
                    console.warn("Private media query note:", e.message);
                }
            }

            const map = new Map();
            [...publicDocs.documents, ...userDocs.documents].forEach((doc) =>
                map.set(doc.$id, doc)
            );
            return Array.from(map.values());
        } catch (err) {
            console.warn("Feed fetch error:", err.message);
            return [];
        }
    },

    async getMediaById(id) {
        return await databases.getDocument(DB_ID, IMAGES_COLLECTION, id);
    },

    async updateMedia(id, { description, isPublic }) {
        return await databases.updateDocument(DB_ID, IMAGES_COLLECTION, id, {
            description,
            isPublic,
        });
    },

    async deleteMedia(id, fileId) {
        await storage.deleteFile(IMAGES_BUCKET, fileId);
        return await databases.deleteDocument(DB_ID, IMAGES_COLLECTION, id);
    },

    async toggleFavorite(userId, imageId) {
        const existing = await databases.listDocuments(DB_ID, FAVORITES_COLLECTION, [
            Query.equal("userId", userId),
            Query.equal("imageId", imageId),
        ]);

        if (existing.total > 0) {
            await databases.deleteDocument(DB_ID, FAVORITES_COLLECTION, existing.documents[0].$id);
            return false;
        } else {
            await databases.createDocument(DB_ID, FAVORITES_COLLECTION, ID.unique(), {
                userId,
                imageId,
            });
            return true;
        }
    },

    async getUserFavorites(userId) {
        if (!userId) return { documents: [] };
        try {
            const favs = await databases.listDocuments(DB_ID, FAVORITES_COLLECTION, [
                Query.equal("userId", userId),
            ]);
            const imageIds = favs.documents.map((d) => d.imageId);
            if (imageIds.length === 0) return { documents: [] };

            return await databases.listDocuments(DB_ID, IMAGES_COLLECTION, [
                Query.equal("$id", imageIds),
            ]);
        } catch (err) {
            return { documents: [] };
        }
    },

    async checkIsFavorite(userId, imageId) {
        if (!userId) return false;
        try {
            const existing = await databases.listDocuments(DB_ID, FAVORITES_COLLECTION, [
                Query.equal("userId", userId),
                Query.equal("imageId", imageId),
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

    async toggleBlockUser(documentId, isBlocked) {
        return await databases.updateDocument(DB_ID, PROFILES_COLLECTION, documentId, {
            isBlocked,
        });
    },
};