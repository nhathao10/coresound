import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Chọn...",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update selected value when prop changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (option) => {
    setSelectedValue(option.value);
    setIsOpen(false);
    if (onChange) {
      onChange(option.value);
    }
  };

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <div 
      ref={dropdownRef}
      className={`custom-dropdown ${className} ${disabled ? 'disabled' : ''}`}
    >
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </div>
      </div>
      
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`dropdown-option ${selectedValue === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
