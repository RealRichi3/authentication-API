import { Model, Schema, model } from 'mongoose';
import { IPassword, IPasswordDoc } from './types/password.types';
import bcrypt from 'bcrypt';

const options = { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } };

const password_schema = new Schema<IPasswordDoc>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        password: { type: String, required: true },
    },
    options
);

password_schema.method('updatePassword', async function updatePassword(new_password: string) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(new_password, salt);

    await this.updateOne({ password: this.password })
})
password_schema.method('comparePassword', async function comparePassword(password: string) {
    return await bcrypt.compare(password, this.password);
})

password_schema.pre('save', async function save(next) {
    if (this.isModified('password')) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    next();
})

const Password: Model<IPasswordDoc> = model<IPasswordDoc>('Password', password_schema);

export { Password, IPassword, IPasswordDoc, password_schema };
