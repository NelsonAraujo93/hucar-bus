import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitcher } from './shared/ui/language-switcher/language-switcher';

@Component({
  imports: [RouterOutlet, LanguageSwitcher],
  selector: 'hb-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
