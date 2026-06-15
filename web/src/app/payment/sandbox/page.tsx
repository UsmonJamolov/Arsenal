import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function SandboxRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const intent = params.intent;

  if (intent) {
    redirect(`/payment/checkout?intent=${intent}`);
  }

  redirect("/");
}
