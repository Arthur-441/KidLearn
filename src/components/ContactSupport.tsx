import React from "react";

export default function ContactSupport() {
  return (
    <div className="bg-[#f0f4ff] rounded-2xl p-6 shadow-sm border border-[#e0e7ff] text-center max-w-sm mt-8 w-full mt-auto mb-4 mx-auto">
      <h3 className="font-['Baloo_2'] text-xl font-bold mb-4 text-[#1a1a2e]">
        Need help? Reach out to us
      </h3>
      <div className="flex justify-center gap-4">
        <a
          href="https://wa.me/256745635953"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:scale-105"
        >
          <div className="text-2xl">💬</div>
          <span className="text-xs font-bold text-[#4a4a6a]">WhatsApp</span>
        </a>
        <a
          href="mailto:Arthur.l.shalom@gmail.com"
          className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:scale-105"
        >
          <div className="text-2xl">✉️</div>
          <span className="text-xs font-bold text-[#4a4a6a]">Email</span>
        </a>
        <a
          href="tel:+256745635953"
          className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:scale-105"
        >
          <div className="text-2xl">📞</div>
          <span className="text-xs font-bold text-[#4a4a6a]">Phone</span>
        </a>
      </div>
    </div>
  );
}
