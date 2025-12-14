import { PawPrint } from "lucide-react";

const PawDecoration = () => {
  return (
    <>
      {/* Floating paw decorations */}
      <div className="absolute top-20 left-10 opacity-20 animate-paw-float">
        <PawPrint className="w-12 h-12 text-paw rotate-[-15deg]" />
      </div>
      <div className="absolute top-40 right-20 opacity-15 animate-paw-float animation-delay-400">
        <PawPrint className="w-8 h-8 text-paw rotate-[20deg]" />
      </div>
      <div className="absolute bottom-32 left-1/4 opacity-10 animate-paw-float animation-delay-600">
        <PawPrint className="w-10 h-10 text-paw rotate-[10deg]" />
      </div>
      <div className="absolute top-1/3 left-1/3 opacity-10 animate-paw-float animation-delay-200">
        <PawPrint className="w-6 h-6 text-paw-subtle rotate-[-25deg]" />
      </div>
      <div className="absolute bottom-20 right-1/3 opacity-15 animate-paw-float animation-delay-800">
        <PawPrint className="w-14 h-14 text-paw-subtle rotate-[5deg]" />
      </div>
    </>
  );
};

export default PawDecoration;