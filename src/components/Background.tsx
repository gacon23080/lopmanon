import React from 'react';
import classroomBg from '../assets/images/pastel_purple_kindergarten_classroom_bg_1791030887402.jpg';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Static Kindergarten Classroom Background Image (Nền tĩnh lớp mầm non) */}
      <img
        src={classroomBg}
        alt="Background lớp mầm non"
        className="w-full h-full object-cover object-center"
      />
      {/* Soft pastel overlay to maintain contrast and readable text */}
      <div className="absolute inset-0 bg-[#EFE9FB]/75 backdrop-blur-[1.5px]" />
    </div>
  );
};
