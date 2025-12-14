import { PawPrint, Bone } from "lucide-react";

const PawDecoration = () => {
  return (
    <>
      {/* Paws */}
      <div className="absolute top-16 left-8 opacity-20 animate-paw-float">
        <PawPrint className="w-12 h-12 text-paw rotate-[-15deg]" />
      </div>

      <div className="absolute top-36 right-24 opacity-15 animate-paw-float animation-delay-300">
        <PawPrint className="w-8 h-8 text-paw rotate-[20deg]" />
      </div>

      <div className="absolute top-1/5 left-1/3 opacity-10 animate-paw-float animation-delay-600">
        <PawPrint className="w-10 h-10 text-paw-subtle rotate-[10deg]" />
      </div>

      <div className="absolute bottom-32 left-16 opacity-15 animate-paw-float animation-delay-900">
        <PawPrint className="w-6 h-6 text-paw rotate-[-25deg]" />
      </div>

      <div className="absolute bottom-24 right-1/4 opacity-10 animate-paw-float animation-delay-1200">
        <PawPrint className="w-14 h-14 text-paw-subtle rotate-[5deg]" />
      </div>

      <div className="absolute top-1/2 right-12 opacity-12 animate-paw-float animation-delay-1500">
        <PawPrint className="w-9 h-9 text-paw rotate-[-10deg]" />
      </div>

      {/* Bones */}
      <div className="absolute top-28 left-1/2 opacity-10 animate-paw-float animation-delay-500">
        <Bone className="w-14 h-14 text-paw-subtle rotate-[15deg]" />
      </div>

      <div className="absolute bottom-40 right-10 opacity-15 animate-paw-float animation-delay-800">
        <Bone className="w-10 h-10 text-paw rotate-[-20deg]" />
      </div>

      <div className="absolute top-2/3 left-1/4 opacity-12 animate-paw-float animation-delay-1100">
        <Bone className="w-12 h-12 text-paw-subtle rotate-[8deg]" />
      </div>

      <div className="absolute bottom-12 left-1/2 opacity-10 animate-paw-float animation-delay-1400">
        <Bone className="w-8 h-8 text-paw rotate-[-12deg]" />
      </div>
    </>
  );
};

export default PawDecoration;
