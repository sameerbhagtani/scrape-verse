async function buildTokenPayload(user: Record<string, unknown> | object) {
    const u = user as any;
    let userIdStr = "";
    const rawId = u._id || u.id || u.userId;
    if (rawId) {
        const str = String(rawId);
        const match = str.match(/[0-9a-fA-F]{24}/);
        userIdStr = match ? match[0] : str;
    }

    const tokenPayload = {
        _id: userIdStr,
        userId: userIdStr,
        name: u.name || "",
        email: u.email || "",
        isVerified: Boolean(u.isVerified),
    };
    return tokenPayload;
}

export default buildTokenPayload;
