import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Necessary for changing language dynamically without reloading
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(key: string, params?: Record<string, string>): string {
    return this.languageService.translate(key, params) as string;
  }
}
