const a = () => {
  console.log(22);

  try {
    console.log(11);
    return
  } catch (error) {
    console.log(44);
  } finally {
    console.log(55);
  }
  console.log(333);
};
a()
