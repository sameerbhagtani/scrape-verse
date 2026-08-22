// Importing modules
import User from "../../shared/models/user.model.js";

// class to handle user data access operations
class UserDao {
    UserModel: typeof User;

    constructor() {
        // initializing the user model
        this.UserModel = User;
    }

    // function to create a new user
    async createUser(userData: Record<string, unknown>) {
        const user = await this.UserModel.create(userData);
        return user;
    }

    // function to find a user by email
    async findUserByEmail(email: string) {
        return await this.UserModel.findOne({ email });
    }

    // function to find a user by id
    async findUserById(id: string) {
        if (!id) return null;
        const hexMatch = String(id).match(/[0-9a-fA-F]{24}/);
        const validId = hexMatch ? hexMatch[0] : id;
        return await this.UserModel.findById(validId);
    }

    // function to update a user by id
    async updateUserById(id: string, updateData: Record<string, unknown>) {
        const hexMatch = String(id).match(/[0-9a-fA-F]{24}/);
        const validId = hexMatch ? hexMatch[0] : id;
        return await this.UserModel.findByIdAndUpdate(validId, updateData, { new: true });
    }

    // function to delete a user by id
    async deleteUserById(id: string) {
        const hexMatch = String(id).match(/[0-9a-fA-F]{24}/);
        const validId = hexMatch ? hexMatch[0] : id;
        return await this.UserModel.findByIdAndDelete(validId);
    }
}

export default UserDao;
