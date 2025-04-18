import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function EnterGame() {
  return (
    <div className="flex justify-center mt-16">
      <div className="flex flex-col justify-center w-3xl">
        <h3 className="text-2xl">Wilkommen zu</h3>
        <h1 className="text-4xl bg-amber-300 mb-2">Der Dümmste fliegt!</h1>
        <Label>Gib hier deinen Namen ein:</Label>
        <Input placeholder="Name" /> 
      </div>
    </div>
  );
}