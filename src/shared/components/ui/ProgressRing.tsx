import { useState, useEffect } from 'react'

interface ProgressRingProps {
  percentage?: number
  size?: number
  strokeWidth?: number
  showText?: boolean
  className?: string
  color?: string
}

export default function ProgressRing({ 
  percentage = 0, 
  size = 80, 
  strokeWidth = 6,
  showText = true,
  className = "",
  color = "#3B82F6"
}: ProgressRingProps) {
  const [currentPercentage, setCurrentPercentage] = useState(0);

  useEffect(() => {
    // Smoothly transition to the target percentage
    const animationFrame = requestAnimationFrame(() => {
      setCurrentPercentage(percentage);
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (currentPercentage / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">
            {Math.round(currentPercentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

