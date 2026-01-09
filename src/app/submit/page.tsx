import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SubmitCompForm from "@/components/SubmitCompForm";

export default async function SubmitPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    return <SubmitCompForm />;
}
