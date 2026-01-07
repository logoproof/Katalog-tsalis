export default function Footer(){
  return (
    <footer className="w-full bg-white border-t border-gray-100 mt-6">
      <div className="max-w-full sm:max-w-xl md:max-w-2xl lg:w-1/2 mx-auto px-4 py-6 text-xs text-gray-500">
        © {new Date().getFullYear()} Katalog Tsalis — Built with ❤️
      </div>
    </footer>
  )
}
