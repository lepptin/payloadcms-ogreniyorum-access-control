import { Access, AccessResult } from 'payload'
import { Notes } from '../../Notes'

// DELETE: Admin her şeyi silebilir, Author kendi notlarını silebilir, Editor silemez
export const deleteAccessRoleSample: Access = async ({ req, id }): Promise<AccessResult> => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  if (req.user.role === 'editor') return false // Editor silemez[reference:16]
  // Dokümanı veritabanından al

  console.log('id',id)
  if (!id) {
    return false
  }
  console.log('OK-1')
  const note = await req.payload.findByID({
    collection: 'notes',
    id,
    depth:0
  })
console.log('note',note)
  // Eğer doküman bulunamazsa veya sahibi farklıysa reddet
  if (!note) return false
  return note.owner === req.user.id
}
