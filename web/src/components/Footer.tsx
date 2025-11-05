export function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} LIVERIE. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}