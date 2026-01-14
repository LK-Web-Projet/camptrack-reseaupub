export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border-4 border-[#d61353]/30 border-t-[#d61353] rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
                Chargement...
            </p>
        </div>
    );
}
