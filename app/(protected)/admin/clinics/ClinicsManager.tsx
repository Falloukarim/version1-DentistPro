'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@clerk/nextjs';

export default function ClinicsManager() {
  const { getToken } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [newClinic, setNewClinic] = useState({ name: '', address: '' });
  const [assignData, setAssignData] = useState({ clinicId: '', userId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    clerkUserId: '',
    role: 'DENTIST'
  });
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isClinicDialogOpen, setIsClinicDialogOpen] = useState(false);
  const [currentClinicId, setCurrentClinicId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('DENTIST');
  const [users, setUsers] = useState([]);
  const [isRoleAssignmentDialogOpen, setIsRoleAssignmentDialogOpen] = useState(false);

  useEffect(() => { fetchClinics(); }, []);

  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/clinics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw await response.json();
      const data = await response.json();
      setClinics(data);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClinic),
      });
      
      if (!response.ok) throw await response.json();
      
      showSuccess('Clinique créée avec succès');
      setNewClinic({ name: '', address: '' });
      setIsClinicDialogOpen(false);
      fetchClinics();
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw await response.json();
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAssignRole = async () => {
    if (!selectedUserId) return;
  
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/users/assign-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          clerkUserId: selectedUserId, 
          role: selectedRole 
        }),
      });
  
      if (!response.ok) throw await response.json();
      
      showSuccess(`Rôle ${selectedRole} assigné avec succès`);
      setIsRoleAssignmentDialogOpen(false);
      setSelectedUserId('');
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/clinics/assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...assignData,
          clinicId: currentClinicId
        }),
      });

      if (!response.ok) throw await response.json();

      showSuccess('Utilisateur assigné avec succès');
      setAssignData({ clinicId: '', userId: '' });
      setCurrentClinicId('');
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClinic = async (id: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/clinics/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw await response.json();

      showSuccess('Clinique supprimée avec succès');
      fetchClinics();
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!newUser.firstName || !newUser.email || !newUser.clerkUserId || !newUser.role) {
        showError({ message: "Tous les champs obligatoires doivent être remplis" });
        return;
      }
  
      const token = await getToken();
      const response = await fetch('/api/add-dentist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: newUser.firstName.trim(),
          lastName: newUser.lastName.trim(),
          email: newUser.email.trim(),
          clerkUserId: newUser.clerkUserId.trim(),
          role: newUser.role
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'ajout de l'utilisateur");
      }
  
      showSuccess(`${newUser.role} ajouté avec succès`);
      setIsUserDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        clerkUserId: '',
        role: 'DENTIST'
      });
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (message: string) => toast({
    title: "Succès",
    description: message,
  });

  const showError = (error: any) => toast({ 
    title: "Erreur", 
    description: error.message || 'Erreur inconnue',
    variant: "destructive" 
  });
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Gestion des Cliniques</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button 
            onClick={() => setIsUserDialogOpen(true)} 
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            + Ajouter utilisateur
          </Button>
          <Button 
            onClick={() => {
              setIsRoleAssignmentDialogOpen(true);
              fetchUsers();
            }}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            + Assigner rôle
          </Button>
          <Button 
            onClick={() => setIsClinicDialogOpen(true)} 
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            + Ajouter clinique
          </Button>
        </div>
      </div>

      {/* Dialogue pour assigner un rôle */}
      <Dialog open={isRoleAssignmentDialogOpen} onOpenChange={setIsRoleAssignmentDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un rôle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label className="sm:text-right">Utilisateur</Label>
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem 
                      key={user.clerkUserId} 
                      value={user.clerkUserId}
                    >
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label className="sm:text-right">Rôle</Label>
              <Select 
                value={selectedRole} 
                onValueChange={setSelectedRole}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DENTIST">Dentiste</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAssignRole}
              disabled={!selectedUserId || isLoading}
              className="mt-4"
            >
              {isLoading ? "En cours..." : "Assigner le rôle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter un utilisateur */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel Utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="sm:text-right">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  className="sm:col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="sm:text-right">Nom</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  className="sm:col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="sm:text-right">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="sm:col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="clerkUserId" className="sm:text-right">
                  ID Clerk <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clerkUserId"
                  value={newUser.clerkUserId}
                  onChange={(e) => setNewUser({...newUser, clerkUserId: e.target.value})}
                  className="sm:col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="sm:text-right">
                  Rôle <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                  required
                  className="sm:col-span-3"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DENTIST">Dentiste</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" disabled={isLoading} className="mt-4">
                {isLoading ? "En cours..." : "Créer l'utilisateur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter une clinique */}
      <Dialog open={isClinicDialogOpen} onOpenChange={setIsClinicDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Clinique</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateClinic}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="sm:text-right">Nom</Label>
                <Input
                  id="name"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({...newClinic, name: e.target.value})}
                  className="sm:col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="sm:text-right">Adresse</Label>
                <Input
                  id="address"
                  value={newClinic.address}
                  onChange={(e) => setNewClinic({...newClinic, address: e.target.value})}
                  className="sm:col-span-3"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="mt-4">
                {isLoading ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Liste responsive des cliniques */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center">Chargement...</div>
        ) : clinics.length === 0 ? (
          <div className="col-span-full text-center">Aucune clinique trouvée.</div>
        ) : (
          clinics.map((clinic) => (
            <div key={clinic.id} className="border p-4 rounded-lg flex flex-col">
              <div className="flex-grow">
                <h3 className="font-medium text-lg">{clinic.name}</h3>
                {clinic.address && <p className="text-sm text-gray-500 mt-1">{clinic.address}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={isLoading}
                      onClick={() => setCurrentClinicId(clinic.id)}
                      className="w-full sm:w-auto"
                    >
                      Assigner utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assigner à {clinic.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignUser}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                          <Label htmlFor="userId" className="sm:text-right">ID Utilisateur</Label>
                          <Input
                            id="userId"
                            value={assignData.userId}
                            onChange={(e) => setAssignData({
                              ...assignData,
                              userId: e.target.value
                            })}
                            className="sm:col-span-3"
                            required
                          />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Assignation..." : "Assigner"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteClinic(clinic.id)}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}