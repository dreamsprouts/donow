import React from 'react';
import { CirclePicker } from 'react-color';

/**
 * CirclePicker 包裝組件
 * 使用 JavaScript 默認參數替代已棄用的 defaultProps
 * 解決 "Support for defaultProps will be removed from function components" 警告
 */
const ColorPickerWrapper = ({
  colors,
  color,
  onChange,
  circleSize = 28,
  circleSpacing = 14,
  width = 252,
  ...otherProps
}) => {
  return (
    <CirclePicker
      colors={colors}
      color={color}
      onChange={onChange}
      circleSize={circleSize}
      circleSpacing={circleSpacing}
      width={width}
      {...otherProps}
    />
  );
};

export default ColorPickerWrapper; 