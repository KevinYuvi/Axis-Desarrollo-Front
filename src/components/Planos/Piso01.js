import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Path, Rect, G, Polygon, Circle } from 'react-native-svg';

export default function Piso01({ onAulaPress }) {
  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      {/* ⚠️ INSTRUCCIÓN:
        Abre tu archivo 'piso01.txt'.
        Copia todo lo que está DENTRO de la etiqueta <svg> ... </svg> y pégalo justo aquí abajo.
        Asegúrate de cambiar las etiquetas a mayúsculas (Path, Rect, G).
      */}
      <Svg width="100%" height="100%" viewBox="0 0 800 600">
        
        {/* EJEMPLO DE CÓMO ENVOLVER TUS AULAS PARA QUE SEAN CLICKEABLES: */}
        {/* <TouchableOpacity onPress={() => onAulaPress('Aula 101')}>
          <Path id="aula_101" d="M10...Z" fill="#D1FAE5" stroke="#065F46" strokeWidth="2" />
        </TouchableOpacity> 
        */}

      </Svg>
    </View>
  );
}