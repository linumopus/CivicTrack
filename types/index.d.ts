export type UserRole = 'citizen' | 'admin';
export type ComplaintCategory = 'Road' | 'Lighting' | 'Drainage' | 'Garbage';
export type ComplaintStatus = 'Pending' | 'In-Progress' | 'Resolved';
export type LngLat = [number, number];
export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    department?: string;
}
export interface IUserAuth extends IUser {
    token: string;
}
export interface IComplaint {
    _id: string;
    title: string;
    description: string;
    category: ComplaintCategory;
    status: ComplaintStatus;
    location: {
        type: 'Point';
        coordinates: LngLat;
    };
    imageUrl?: string;
    upvotes: string[];
    reporter: string;
    createdAt: string;
}
export interface ComplaintStatusPatchBody {
    status: ComplaintStatus;
}
//# sourceMappingURL=index.d.ts.map