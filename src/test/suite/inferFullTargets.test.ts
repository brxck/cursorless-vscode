import * as assert from "assert";

import { inferFullTargets } from "../../inferFullTargets";
import fixture from "./fixtures/inferFullTargets.fixture";

suite.skip("inferFullTargets", () => {
  fixture.forEach(({ input, expectedOutput }, index) => {
    test(`inferFullTargets ${index}`, () => {
      assert.deepStrictEqual(
        expectedOutput,
        inferFullTargets(
          input.context,
          input.partialTargets,
          input.actionPreferences
        )
      );
    });
  });
});
