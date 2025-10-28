import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col gap-3 min-h-screen items-center justify-center  dark:bg-black">
      <h1 className="text-4xl font-bold">Bienvenue sur notre application</h1>
      {/* exemple d'utilisation du bouton avec shadcun UI:  */}
      <Button variant="outline">Button Variant Outline </Button>
    </div>
  );
}
