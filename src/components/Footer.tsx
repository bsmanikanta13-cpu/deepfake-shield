import { Shield, Heart, Mail, GitBranch, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">
                DeepFake<span className="text-cyan-400">Shield</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Multi-modal deepfake detection using self-supervised WavLM audio representations
              and CNN visual features.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Overview", "Architecture", "Live Demo", "Results", "Research"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(" ", "")}`}
                    className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2">
              {[
                { icon: FileText, label: "Research Paper" },
                { icon: GitBranch, label: "Source Code" },
                { icon: FileText, label: "Documentation" },
                { icon: FileText, label: "Model Weights" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  deepfake@research.edu
                </a>
              </li>
              <li className="text-sm text-slate-500 mt-3">
                AI Security Lab
                <br />
                Department of Computer Science
                <br />
                University Research Center
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © 2026 DeepFakeShield Research Project. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-600">
            Built with <Heart className="w-3 h-3 text-red-500" /> for AI Safety
          </p>
        </div>
      </div>
    </footer>
  );
}
