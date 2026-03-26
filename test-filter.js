// Test the filtering logic from contentStore.ts

function createFilterByChannel(items, channelId, tagFilter) {
  return items.filter((item) => {
    const itemChannelId = item.channelId;
    if (itemChannelId) {
      return itemChannelId === channelId;
    }
    if (tagFilter?.length) {
      const tags = item.tags;
      return tags && tagFilter.some((tag) => tags.includes(tag));
    }
    return false;
  });
}

// Test cases
console.log(
  "=== Test 1: Static content without channelId, with matching tags ===",
);
const staticWithTags = [
  { id: "1", title: "JS Question", tags: ["javascript", "async"] },
  { id: "2", title: "DevOps Question", tags: ["devops", "docker"] },
];
const result1 = createFilterByChannel(staticWithTags, "devops", [
  "devops",
  "docker",
  "ci-cd",
  "linux",
]);
console.log("Expected: 1 (DevOps Question), Got:", result1.length);
console.log(
  "Items:",
  result1.map((i) => i.title),
);

console.log(
  "\n=== Test 2: Static content without channelId, no matching tags ===",
);
const result2 = createFilterByChannel(staticWithTags, "javascript", [
  "devops",
  "docker",
]);
console.log("Expected: 0, Got:", result2.length);

console.log("\n=== Test 3: Generated content with channelId matching ===");
const generatedWithChannelId = [
  { id: "3", title: "DevOps Generated", channelId: "devops", tags: [] },
  { id: "4", title: "JavaScript Generated", channelId: "javascript", tags: [] },
];
const result3 = createFilterByChannel(generatedWithChannelId, "devops", [
  "devops",
  "docker",
]);
console.log("Expected: 1 (DevOps Generated), Got:", result3.length);
console.log(
  "Items:",
  result3.map((i) => i.title),
);

console.log("\n=== Test 4: Generated content with channelId NOT matching ===");
const result4 = createFilterByChannel(generatedWithChannelId, "python", [
  "devops",
  "docker",
]);
console.log("Expected: 0, Got:", result4.length);

console.log("\n=== Test 5: Mixed content ===");
const mixedContent = [
  { id: "5", title: "Static DevOps", tags: ["devops", "docker"] },
  { id: "6", title: "Static JS", tags: ["javascript"] },
  { id: "7", title: "Generated DevOps", channelId: "devops", tags: [] },
  { id: "8", title: "Generated JS", channelId: "javascript", tags: [] },
];
const result5 = createFilterByChannel(mixedContent, "devops", [
  "devops",
  "docker",
]);
console.log(
  "Expected: 2 (Static DevOps + Generated DevOps), Got:",
  result5.length,
);
console.log(
  "Items:",
  result5.map((i) => i.title),
);

console.log("\n=== Test 6: Empty tagFilter ===");
const result6 = createFilterByChannel(staticWithTags, "devops", []);
console.log("Expected: 0 (no tagFilter), Got:", result6.length);

console.log("\n=== Test 7: Undefined tagFilter ===");
const result7 = createFilterByChannel(staticWithTags, "devops", undefined);
console.log("Expected: 0 (undefined tagFilter), Got:", result7.length);

console.log("\n=== Test 8: Channel ID empty string ===");
const withEmptyChannelId = [
  { id: "9", title: "Empty channelId", channelId: "", tags: ["devops"] },
];
const result8 = createFilterByChannel(withEmptyChannelId, "devops", ["devops"]);
console.log(
  "Expected: 1 (empty channelId goes to tag check), Got:",
  result8.length,
);
console.log(
  "Items:",
  result8.map((i) => i.title),
);
