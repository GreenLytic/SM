import { collection, addDoc, updateDoc, doc, deleteDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Employee, EmployeeFormData } from '../../types/employee';
import { toast } from 'react-hot-toast';

export class EmployeeService {
  private static COLLECTION = 'employees';

  static async createEmployee(data: EmployeeFormData): Promise<string> {
    try {
      const employeeData: Omit<Employee, 'id'> = {
        ...data,
        startDate: new Date(data.startDate),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...employeeData,
        startDate: Timestamp.fromDate(employeeData.startDate),
        createdAt: Timestamp.fromDate(employeeData.createdAt),
        updatedAt: Timestamp.fromDate(employeeData.updatedAt)
      });

      toast.success('Employé ajouté avec succès');
      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Erreur lors de la création de l\'employé');
      throw error;
    }
  }

  static async updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      if (data.startDate) {
        updateData.startDate = new Date(data.startDate);
      }

      await updateDoc(doc(db, this.COLLECTION, id), {
        ...updateData,
        ...(updateData.startDate && { startDate: Timestamp.fromDate(updateData.startDate) }),
        updatedAt: Timestamp.fromDate(updateData.updatedAt)
      });

      toast.success('Employé mis à jour avec succès');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Erreur lors de la mise à jour de l\'employé');
      throw error;
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, id));
      toast.success('Employé supprimé avec succès');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Erreur lors de la suppression de l\'employé');
      throw error;
    }
  }

  static subscribeToEmployees(onUpdate: (employees: Employee[]) => void): () => void {
    const q = query(collection(db, this.COLLECTION), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Employee[];

      onUpdate(employees);
    });
  }
}