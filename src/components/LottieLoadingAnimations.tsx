import React from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

// Lottie car animation data (lightweight JSON)
const carAnimationData = {
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 90,
  "w": 200,
  "h": 200,
  "nm": "Car Loading",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Car",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": {
          "a": 1,
          "k": [
            { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 0, "s": [50, 100], "to": [25, 0], "ti": [-25, 0] },
            { "t": 45, "s": [200, 100] },
            { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 45, "s": [200, 100], "to": [25, 0], "ti": [-25, 0] },
            { "t": 90, "s": [50, 100] }
          ]
        },
        "a": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "rc",
              "d": 1,
              "s": { "a": 0, "k": [40, 20] },
              "p": { "a": 0, "k": [0, 0] },
              "r": { "a": 0, "k": 6 }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.2, 0.4, 1, 1] },
              "o": { "a": 0, "k": 100 }
            }
          ]
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [8, 8] },
              "p": { "a": 0, "k": [-12, 8] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": {
                "a": 1,
                "k": [
                  { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": [0] },
                  { "t": 90, "s": [360] }
                ]
              },
              "o": { "a": 0, "k": 100 }
            }
          ]
        },
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [8, 8] },
              "p": { "a": 0, "k": [12, 8] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
              "o": { "a": 0, "k": 100 }
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": {
                "a": 1,
                "k": [
                  { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": [0] },
                  { "t": 90, "s": [360] }
                ]
              },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 90,
      "st": 0,
      "bm": 0
    }
  ]
};

// Loading dots animation data
const dotsAnimationData = {
  "v": "5.7.4",
  "fr": 24,
  "ip": 0,
  "op": 60,
  "w": 80,
  "h": 20,
  "nm": "Loading Dots",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Dot 1",
      "sr": 1,
      "ks": {
        "o": {
          "a": 1,
          "k": [
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": [50] },
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 15, "s": [100] },
            { "t": 30, "s": [50] }
          ]
        },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [20, 10] },
        "a": { "a": 0, "k": [0, 0] },
        "s": {
          "a": 1,
          "k": [
            { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 0, "s": [80, 80, 100] },
            { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 15, "s": [120, 120, 100] },
            { "t": 30, "s": [80, 80, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [8, 8] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.2, 0.4, 1, 1] },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 60,
      "st": 0,
      "bm": 0
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Dot 2",
      "sr": 1,
      "ks": {
        "o": {
          "a": 1,
          "k": [
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 5, "s": [50] },
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 20, "s": [100] },
            { "t": 35, "s": [50] }
          ]
        },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [40, 10] },
        "a": { "a": 0, "k": [0, 0] },
        "s": {
          "a": 1,
          "k": [
            { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 5, "s": [80, 80, 100] },
            { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 20, "s": [120, 120, 100] },
            { "t": 35, "s": [80, 80, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [8, 8] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.2, 0.4, 1, 1] },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 60,
      "st": 0,
      "bm": 0
    },
    {
      "ddd": 0,
      "ind": 3,
      "ty": 4,
      "nm": "Dot 3",
      "sr": 1,
      "ks": {
        "o": {
          "a": 1,
          "k": [
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 10, "s": [50] },
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 25, "s": [100] },
            { "t": 40, "s": [50] }
          ]
        },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [60, 10] },
        "a": { "a": 0, "k": [0, 0] },
        "s": {
          "a": 1,
          "k": [
            { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 10, "s": [80, 80, 100] },
            { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 25, "s": [120, 120, 100] },
            { "t": 40, "s": [80, 80, 100] }
          ]
        }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [8, 8] },
              "p": { "a": 0, "k": [0, 0] }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.2, 0.4, 1, 1] },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 60,
      "st": 0,
      "bm": 0
    }
  ]
};

// Main Car Loading Animation with Lottie
export const CarTravelingLoader = ({ message = "Loading your perfect ride..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
        <p className="text-muted-foreground text-sm">Please wait while we prepare everything</p>
      </motion.div>

      {/* Lottie Car Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        <Lottie
          animationData={carAnimationData}
          style={{ width: 200, height: 200 }}
          loop={true}
          autoplay={true}
        />
      </motion.div>

      {/* Loading Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Lottie
          animationData={dotsAnimationData}
          style={{ width: 80, height: 20 }}
          loop={true}
          autoplay={true}
        />
      </motion.div>
    </div>
  );
};

// Lightweight Loading Spinner for small components
export const LoadingSpinner = ({ size = 24, className = "" }: { size?: number; className?: string }) => {
  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
          className="animate-pulse spinner-dash"

        />
      </svg>

    </motion.div>
  );
};

// Minimal Car Card Skeleton
export const CarCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-card p-6 space-y-4 animate-pulse">
      <div className="aspect-video bg-gray-200 rounded-lg"></div>
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
};

// Grid of car card skeletons
export const CarListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <CarCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

// Backward compatibility
export const PremiumCarSkeleton = CarListSkeleton;