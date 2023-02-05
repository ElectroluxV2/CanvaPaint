export const makeOption = name => {
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;

  const span = document.createElement('span');
  span.classList.add('material-symbols-outlined');

  const label = document.createElement('label');

  label.append(span, input);

  return (icon, value) => {
    input.value = value;
    span.textContent = icon;

    return label.cloneNode(true);
  };
};
