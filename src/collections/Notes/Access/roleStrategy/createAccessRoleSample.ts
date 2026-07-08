import { Access, AccessResult } from "payload";

// CREATE: Admin, Editor, Author hepsi oluşturabilir
export const createAccessRoleSample : Access = ({req}):AccessResult=>{
    if (req?.user?.role) {
        return ['admin', 'editor', 'author'].includes(req.user.role)
    }
    return false;
}