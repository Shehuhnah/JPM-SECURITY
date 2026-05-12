export const getPersonName = (person, fallback = "Unknown") => {
  if (!person) return fallback;

  const firstName = person.firstName?.trim?.() || "";
  const lastName = person.lastName?.trim?.() || "";
  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) return combinedName;
  if (person.fullName?.trim?.()) return person.fullName.trim();
  if (person.name?.trim?.()) return person.name.trim();

  return fallback;
};

export const getPersonInitial = (person, fallback = "?") => {
  const name = getPersonName(person, "").trim();
  return name ? name.charAt(0).toUpperCase() : fallback;
};
