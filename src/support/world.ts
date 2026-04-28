import { IWorldOptions, World, setWorldConstructor } from "@cucumber/cucumber";
import { BrowserSession } from "../utils/browser-manager";
import { LoginPage } from "../pages/login.page";
import { ApiClient } from "../utils/api-client";
import { NaukriProfilePage } from "../pages/naukri-profile.page";

export class CustomWorld extends World {
  session?: BrowserSession;
  loginPage?: LoginPage;
  naukriProfilePage?: NaukriProfilePage;
  apiClient?: ApiClient;
  previousResumeUpdatedText?: string;
  currentResumeUpdatedText?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
