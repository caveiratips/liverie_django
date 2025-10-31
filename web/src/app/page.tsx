import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona a página inicial para a loja pública
  redirect("/loja");
}
