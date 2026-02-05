import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Portfolio initialized');
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
