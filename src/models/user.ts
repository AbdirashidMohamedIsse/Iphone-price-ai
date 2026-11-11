import { Schema, model, models, type Model } from "mongoose";

export interface UserDoc {
  clientId: string;
  searchCount: number;
  lastSeenAt: Date;
}

const UserSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true }, // anonymous cookie id until auth is added
    searchCount: { type: Number, default: 0 },
    lastSeenAt: Date,
  },
  { timestamps: true, collection: "users" },
);

export const User = (models.User as Model<UserDoc> | undefined) ?? model<UserDoc>("User", UserSchema);
