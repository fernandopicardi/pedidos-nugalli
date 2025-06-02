export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Nugali Seasonal Selections. Todos os direitos reservados.
        </p>
        <p className="text-xs mt-2">
          Uma experiência de e-commerce premium.
        </p>
      </div>
    </footer>
  );
}
