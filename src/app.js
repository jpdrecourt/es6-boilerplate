let greet = (divId, greeting) => {
  const elt = document.getElementById(divId);
  elt.innerText = greeting;
};

greet('greeting', 'Hello world!');
