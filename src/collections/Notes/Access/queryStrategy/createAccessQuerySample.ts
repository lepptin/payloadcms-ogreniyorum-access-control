import { Access, AccessResult } from "payload";

// CREATE: Tüm giriş yapmış kullanıcılar not oluşturabilir
export const createAccessQuerySample:Access=({req}):AccessResult=>{
    return Boolean(req.user)
}