import React from 'react'
import './AdminPage.css'

function AdminPage() {
  return (
    <div className="admin-page">
      <header className="header">
        <div className="logo">COZY</div>
        <nav className="navigation">
          <button className="nav-button">주문하기</button>
          <button className="nav-button active">관리자</button>
        </nav>
      </header>

      <main className="main-content">
        <h1>관리자 화면</h1>
        <p>곧 재고 관리와 주문 현황이 여기에 표시됩니다.</p>
      </main>
    </div>
  )
}

export default AdminPage
