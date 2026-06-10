export const letters = Array.from({ length: 30 }).map((_, index) => ({
  id: index + 1,
  titleKey: `dailyLetters.${index}.title`,
  contentKey: `dailyLetters.${index}.content`
}));

export const getLetterForDay = (dayIndex) => {
  if (!dayIndex || dayIndex < 0) return letters[0];
  return letters[dayIndex % letters.length];
};
