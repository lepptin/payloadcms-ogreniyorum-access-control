import { CollectionConfig } from "payload";

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      access: {
        create: ({ req }) => req.user?.role === 'admin', // Sadece admin title belirleyebilir
        read: ({ req }) => true, // Herkes okuyabilir
        update: ({ req }) => req.user?.role === 'admin' // Sadece admin güncelleyebilir
      }
    },
    {
      name: 'content',
      type: 'textarea',
      access: {
        read: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
        // Sadece admin ve editor taslak içeriği görebilir
        update: ({ req }) => req.user?.role === 'admin' // Sadece admin düzenleyebilir
      }
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: ({ req }) => true, // Herkes author belirtebilir
        read: ({ req }) => true,
        update: ({ req }) => false // Hiç kimse author'ı güncelleyemez (sadece oluşturma)
      }
    }
  ]
}