// app/select-clinic/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function SelectClinicPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { clinic: true }
  });

  const clinics = await prisma.clinic.findMany({ where: { isActive: true } });

  async function assignClinic(formData: FormData) {
    "use server";
    const clinicId = formData.get("clinicId");
    await prisma.user.update({
      where: { clerkUserId: userId },
      data: { clinicId: String(clinicId) }
    });
    redirect("/dashboard");
  }

  return (
    <div>
      <h1>Sélectionnez une clinique</h1>
      <form action={assignClinic}>
        <select name="clinicId">
          {clinics.map(clinic => (
            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
          ))}
        </select>
        <button type="submit">Valider</button>
      </form>
    </div>
  );
}