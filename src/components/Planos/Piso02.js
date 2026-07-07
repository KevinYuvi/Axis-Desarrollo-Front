import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, G, Polygon, Circle } from 'react-native-svg';

export default function Piso02({ onAulaPress }) {
  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* ⚠️ INSTRUCCIÓN:
        Abre tu archivo 'piso02.txt'.
        Copia el contenido y pégalo aquí abajo cambiando a mayúsculas (Path, Rect, G).
      */}
      <Svg width="100%" height="100%" viewBox="0 0 800 600">
        
        {/* EJEMPLO: */}
        {/* <TouchableOpacity onPress={() => onAulaPress('Lab 201')}>
          <Path id="lab_201" d="M50...Z" fill="#FEE2E2" stroke="#991B1B" strokeWidth="2" />
        </TouchableOpacity> 
        */}

      </Svg>
    </View>
  );
}