
"use client";

import React, { useContext } from 'react';
import { AppContext } from '../providers/AppProvider';

import FloatingCrystals from './backgrounds/FloatingCrystals';
import CosmicNebula from './backgrounds/CosmicNebula';
import DigitalMatrix from './backgrounds/DigitalMatrix';
import AbstractParticles from './backgrounds/AbstractParticles';
import SynthwaveSunset from './backgrounds/SynthwaveSunset';

const themeMap = {
    'FloatingCrystals': FloatingCrystals,
    'CosmicNebula': CosmicNebula,
    'DigitalMatrix': DigitalMatrix,
    'AbstractParticles': AbstractParticles,
    'SynthwaveSunset': SynthwaveSunset,
};

const ThreeBackground = () => {
  const context = useContext(AppContext);
  const theme = context?.active3DTheme || 'FloatingCrystals';
  const BackgroundComponent = themeMap[theme] || FloatingCrystals;
  
  return <BackgroundComponent />;
};

export default ThreeBackground;
