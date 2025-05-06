// app/(protected)/admin/clinics/AdminInterface.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
interface AdminInterfaceProps {
  clinics: any[];
  isLoading: boolean;
  onAssignUser: (data: { clinicId: string; userId: string }) => Promise<void>;
}

export function AdminInterface({ clinics, isLoading, onAssignUser }: AdminInterfaceProps) {
  const [currentClinicId, setCurrentClinicId] = useState('');
  const [userId, setUserId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClinicId || !userId) return;
    await onAssignUser({ clinicId: currentClinicId, userId });
    setUserId('');
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Gestion des Dentistes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignation des Dentistes aux Cliniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="border p-4 rounded-lg flex flex-col">
                <div className="flex-grow">
                  <h3 className="font-medium text-lg">{clinic.name}</h3>
                </div>
                <div className="mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        disabled={isLoading}
                        onClick={() => setCurrentClinicId(clinic.id)}
                        className="w-full"
                      >
                        Assigner dentiste
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Assigner dentiste à {clinic.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="userId" className="sm:text-right">ID Dentiste</Label>
                            <Input
                              id="userId"
                              value={userId}
                              onChange={(e) => setUserId(e.target.value)}
                              className="sm:col-span-3"
                              required
                              placeholder="ID Clerk du dentiste"
                            />
                          </div>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Assignation..." : "Assigner"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}