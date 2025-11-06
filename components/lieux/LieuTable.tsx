// 'use client'
// import { useState } from 'react'
// import { Lieu } from '@/app/types/lieu'
// import EditLieu from './EditLieu'
// import AddLieu from './AddLieu'
// import DeleteLieu from './DeleteLieu'
// import { FaEdit, FaTrash } from 'react-icons/fa'

// interface LieuTableProps {
//   lieux: Lieu[]
//   onLieuUpdated: () => void
// }

// export default function LieuTable({ lieux, onLieuUpdated }: LieuTableProps) {
//   const [showEditModal, setShowEditModal] = useState(false)
//   const [showDeleteModal, setShowDeleteModal] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [selectedLieu, setSelectedLieu] = useState<Lieu | null>(null)

//   const handleEdit = (lieu: Lieu) => {
//     setSelectedLieu(lieu)
//     setShowEditModal(true)
//   }

//   const handleDelete = (lieu: Lieu) => {
//     setSelectedLieu(lieu)
//     setShowDeleteModal(true)
//   }

//   return (
//     <div className="overflow-x-auto">
//       <div className="flex justify-end mb-4">
//         <button
//           onClick={() => setShowAddModal(true)}
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//         >
//           Ajouter un lieu
//         </button>
//       </div>

//       <table className="min-w-full bg-white">
//         <thead>
//           <tr className="bg-gray-200 text-gray-700">
//             <th className="py-2 px-4 text-left">Nom</th>
//             <th className="py-2 px-4 text-left">Ville</th>
//             <th className="py-2 px-4 text-left">Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {lieux.map((lieu) => (
//             <tr key={lieu.id_lieu} className="border-b hover:bg-gray-100">
//               <td className="py-2 px-4">{lieu.nom}</td>
//               <td className="py-2 px-4">{lieu.ville}</td>
//               <td className="py-2 px-4">
//                 <button
//                   onClick={() => handleEdit(lieu)}
//                   className="text-blue-500 hover:text-blue-700 mr-2"
//                 >
//                   <FaEdit />
//                 </button>
//                 <button
//                   onClick={() => handleDelete(lieu)}
//                   className="text-red-500 hover:text-red-700"
//                 >
//                   <FaTrash />
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {showEditModal && selectedLieu && (
//         <EditLieu
//           lieu={selectedLieu}
//           isOpen={showEditModal}
//           onClose={() => setShowEditModal(false)}
//           onLieuUpdated={onLieuUpdated}
//         />
//       )}

//       {showDeleteModal && selectedLieu && (
//         <DeleteLieu
//           lieu={selectedLieu}
//           isOpen={showDeleteModal}
//           onClose={() => setShowDeleteModal(false)}
//           onLieuUpdated={onLieuUpdated}
//         />
//       )}

//       {showAddModal && (
//         <AddLieu
//           isOpen={showAddModal}
//           onClose={() => setShowAddModal(false)}
//           onLieuUpdated={onLieuUpdated}
//         />
//       )}
//     </div>
//   )
// }