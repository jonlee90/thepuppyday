/**
 * Admin Panel Loading State
 * Shows while auth check happens or pages load
 */

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#434E54]/20 border-t-[#434E54] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#434E54]/60 font-medium">Loading...</p>
      </div>
    </div>
  );
}
