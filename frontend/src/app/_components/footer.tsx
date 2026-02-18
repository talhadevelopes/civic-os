"use client";

export function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{
        background: "rgba(16, 16, 18, 0.98)",
        borderTop: "1px solid #27272a",
        color: "#a1a1aa",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4" style={{color: "#3b82f6", letterSpacing:"0.04em"}}>CIVICOS</h3>
            <p className="text-sm" style={{ color: "#a1a1aa" }}>
              AI-Powered Governance Accountability Platform
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={{color:"#fff"}}>Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-[#3b82f6] transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#3b82f6] transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#docs" className="hover:text-[#3b82f6] transition">
                  API Docs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={{color:"#fff"}}>Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="hover:text-[#3b82f6] transition">
                  About
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-[#3b82f6] transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#3b82f6] transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={{color:"#fff"}}>Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#privacy" className="hover:text-[#3b82f6] transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#3b82f6] transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#3b82f6] transition">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="mt-10 pt-8 text-center text-sm"
          style={{
            borderTop: "1px solid #27272a",
            color: "#71717a",
            letterSpacing: "0.02em"
          }}
        >
          <p>&copy; 2025 CIVICOS. Made for Indian Governance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
